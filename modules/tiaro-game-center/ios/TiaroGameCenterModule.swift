import ExpoModulesCore
import GameKit

/// Resolves a promise at most once (Game Center calls the sign-in handler again later, e.g. after the sheet closes).
private final class Once {
  private var done = false
  private let promise: Promise

  init(_ promise: Promise) {
    self.promise = promise
  }

  func resolve(_ value: Bool) {
    if done { return }
    done = true
    promise.resolve(value)
  }
}

/// Game Center for Tiaro: sign in, submit leaderboard scores, report achievements, open the dashboard.
/// Every call resolves false instead of failing, so the game never breaks when Game Center is off.
public class TiaroGameCenterModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TiaroGameCenter")

    Function("isAuthenticated") { () -> Bool in
      return GKLocalPlayer.local.isAuthenticated
    }

    AsyncFunction("authenticate") { (promise: Promise) in
      let once = Once(promise)
      if GKLocalPlayer.local.isAuthenticated {
        once.resolve(true)
        return
      }
      GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, _ in
        if let viewController = viewController {
          if let presenter = self?.appContext?.utilities?.currentViewController() {
            presenter.present(viewController, animated: true)
          } else {
            once.resolve(false)
          }
          return
        }
        once.resolve(GKLocalPlayer.local.isAuthenticated)
      }
    }.runOnQueue(.main)

    AsyncFunction("submitScore") { (score: Int, leaderboardId: String, promise: Promise) in
      guard GKLocalPlayer.local.isAuthenticated else {
        promise.resolve(false)
        return
      }
      GKLeaderboard.submitScore(score, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [leaderboardId]) { error in
        promise.resolve(error == nil)
      }
    }

    AsyncFunction("reportAchievement") { (achievementId: String, percent: Double, promise: Promise) in
      guard GKLocalPlayer.local.isAuthenticated else {
        promise.resolve(false)
        return
      }
      let achievement = GKAchievement(identifier: achievementId)
      achievement.percentComplete = percent
      achievement.showsCompletionBanner = true
      GKAchievement.report([achievement]) { error in
        promise.resolve(error == nil)
      }
    }

    AsyncFunction("showDashboard") { (promise: Promise) in
      guard GKLocalPlayer.local.isAuthenticated else {
        promise.resolve(false)
        return
      }
      GKAccessPoint.shared.trigger(state: .leaderboards) {}
      promise.resolve(true)
    }.runOnQueue(.main)
  }
}

Pod::Spec.new do |s|
  s.name           = 'TiaroGameCenter'
  s.version        = '1.0.0'
  s.summary        = 'Game Center for Tiaro'
  s.description    = 'Game Center sign-in, leaderboards and achievements for the Tiaro app'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true
  # Swift 5 language mode: no strict-concurrency errors in the GameKit callbacks.
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'GameKit'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end

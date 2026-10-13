/**
 * Plain-language explanations for solver steps (used by hints), in English, Persian or Arabic.
 * Keep sentences short: they are shown in a small card above the board.
 */
import type { Step } from './logic';
import type { UnitRef } from './types';

/**
 * Default region names. The UI palette MUST use the same order
 * (region 0 = purple, 1 = orange, ...), or hint text won't match the colors.
 */
export const REGION_COLOR_NAMES = [
  'purple', 'orange', 'blue', 'green', 'gray', 'red', 'yellow', 'teal', 'pink', 'brown', 'lime',
];

/** Persian region names, same order as REGION_COLOR_NAMES. */
export const REGION_COLOR_NAMES_FA = [
  'بنفش', 'نارنجی', 'آبی', 'سبز', 'خاکستری', 'قرمز', 'زرد', 'فیروزه‌ای', 'صورتی', 'قهوه‌ای', 'لیمویی',
];

/** Arabic region names, same order as REGION_COLOR_NAMES. */
export const REGION_COLOR_NAMES_AR = [
  'البنفسجية', 'البرتقالية', 'الزرقاء', 'الخضراء', 'الرمادية', 'الحمراء', 'الصفراء', 'الفيروزية', 'الوردية', 'البنية', 'الليمونية',
];

/** Russian region names (feminine adjectives agreeing with «область»): nominative and genitive/prepositional. */
export const REGION_COLOR_NAMES_RU = [
  'фиолетовая', 'оранжевая', 'синяя', 'зелёная', 'серая', 'красная', 'жёлтая', 'бирюзовая', 'розовая', 'коричневая', 'лаймовая',
];
const REGION_COLOR_NAMES_RU_OBL = [
  'фиолетовой', 'оранжевой', 'синей', 'зелёной', 'серой', 'красной', 'жёлтой', 'бирюзовой', 'розовой', 'коричневой', 'лаймовой',
];

export type ExplainLanguage = 'en' | 'fa' | 'ar' | 'ru';

export interface ExplainOptions {
  regionName?: (index: number) => string;
  lang?: ExplainLanguage;
}

export function regionColorName(index: number, lang: ExplainLanguage = 'en'): string {
  const names = lang === 'fa' ? REGION_COLOR_NAMES_FA : lang === 'ar' ? REGION_COLOR_NAMES_AR : lang === 'ru' ? REGION_COLOR_NAMES_RU : REGION_COLOR_NAMES;
  return names[index] ?? `#${index + 1}`;
}

export function unitName(u: UnitRef, opts: ExplainOptions = {}): string {
  if (opts.lang === 'fa') {
    if (u.kind === 'row') return `ردیف ${u.index + 1}`;
    if (u.kind === 'column') return `ستون ${u.index + 1}`;
    return `ناحیه‌ی ${opts.regionName?.(u.index) ?? regionColorName(u.index, 'fa')}`;
  }
  if (opts.lang === 'ar') {
    if (u.kind === 'row') return `الصف ${u.index + 1}`;
    if (u.kind === 'column') return `العمود ${u.index + 1}`;
    return `المنطقة ${opts.regionName?.(u.index) ?? regionColorName(u.index, 'ar')}`;
  }
  if (opts.lang === 'ru') return ruUnit(u, 'nom');
  if (u.kind === 'row') return `row ${u.index + 1}`;
  if (u.kind === 'column') return `column ${u.index + 1}`;
  const name = opts.regionName?.(u.index) ?? REGION_COLOR_NAMES[u.index] ?? `#${u.index + 1}`;
  return `the ${name} region`;
}

type RuCase = 'nom' | 'gen' | 'prep';

/** Russian unit names in the case a sentence needs: «ряд 3 / ряда 3 / в ряду 3», «синяя область / синей области». */
function ruUnit(u: UnitRef, c: RuCase): string {
  const n = u.index + 1;
  if (u.kind === 'row') return { nom: `ряд ${n}`, gen: `ряда ${n}`, prep: `ряду ${n}` }[c];
  if (u.kind === 'column') return { nom: `столбец ${n}`, gen: `столбца ${n}`, prep: `столбце ${n}` }[c];
  const adj = c === 'nom' ? REGION_COLOR_NAMES_RU[u.index] : REGION_COLOR_NAMES_RU_OBL[u.index];
  return `${adj ?? `№${n}`} ${c === 'nom' ? 'область' : 'области'}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function list(items: string[], lang: ExplainLanguage = 'en'): string {
  if (items.length <= 1) return items.join('');
  const [sep, and] = lang === 'fa' ? ['، ', ' و '] : lang === 'ar' ? ['، ', ' و'] : lang === 'ru' ? [', ', ' и '] : [', ', ' and '];
  return `${items.slice(0, -1).join(sep)}${and}${items[items.length - 1]}`;
}

export interface Explanation {
  title: string;
  body: string;
}

export function explainStep(step: Step, opts: ExplainOptions = {}): Explanation {
  if (opts.lang === 'fa') return explainStepFa(step, opts);
  if (opts.lang === 'ar') return explainStepAr(step, opts);
  if (opts.lang === 'ru') return explainStepRu(step);
  const name = (u: UnitRef) => unitName(u, opts);
  switch (step.rule) {
    case 'lastCell': {
      const u = name(step.units[0]);
      return { title: 'Only one spot left', body: `${cap(u)} has just one open cell, so its crown goes there.` };
    }
    case 'confinement': {
      const [a, b] = step.units;
      if (a.kind === 'region') {
        return {
          title: 'Region stuck in one line',
          body: `Every open cell of ${name(a)} is in ${name(b)}. Its crown must be there, so the other cells of ${name(b)} can be crossed out.`,
        };
      }
      return {
        title: 'Line owned by one region',
        body: `Every open cell of ${name(a)} belongs to ${name(b)}. That line's crown comes from ${name(b)}, so the rest of ${name(b)} can be crossed out.`,
      };
    }
    case 'blocksUnit': {
      const u = name(step.units[0]);
      return {
        title: 'This cell blocks too much',
        body: `A crown on the highlighted cell would cover every open cell of ${u}, leaving it no room. So this cell can't hold a crown.`,
      };
    }
    case 'group': {
      const k = step.units.length / 2;
      const first = step.units.slice(0, k).map(name);
      const second = step.units.slice(k).map(name);
      return {
        title: `${k} fit in ${k}`,
        body: `${cap(list(first))} only have open cells in ${list(second)}. These ${k} must share those ${k} crowns, so every other open cell in ${list(second)} is out.`,
      };
    }
    case 'contradiction': {
      const u = name(step.units[0]);
      return {
        title: 'What if…?',
        body: `Imagine a crown on the highlighted cell. Following the simple rules, ${u} ends up with no room for a crown. So this cell must be empty.`,
      };
    }
  }
}

function explainStepFa(step: Step, opts: ExplainOptions): Explanation {
  const name = (u: UnitRef) => unitName(u, opts);
  switch (step.rule) {
    case 'lastCell':
      return { title: 'فقط یک جا مانده', body: `${name(step.units[0])} فقط یک خانه‌ی باز دارد، پس تاجش همان‌جاست.` };
    case 'confinement': {
      const [a, b] = step.units;
      if (a.kind === 'region') {
        return {
          title: 'ناحیه در یک خط گیر افتاده',
          body: `همه‌ی خانه‌های باز ${name(a)} در ${name(b)} هستند. تاجش باید همان‌جا باشد، پس بقیه‌ی خانه‌های ${name(b)} ✕ می‌خورند.`,
        };
      }
      return {
        title: 'خطی که مال یک ناحیه است',
        body: `همه‌ی خانه‌های باز ${name(a)} داخل ${name(b)} هستند. تاج این خط از ${name(b)} می‌آید، پس بقیه‌ی ${name(b)} ✕ می‌خورد.`,
      };
    }
    case 'blocksUnit':
      return {
        title: 'این خانه جای زیادی را می‌بندد',
        body: `تاج در خانه‌ی مشخص‌شده همه‌ی خانه‌های باز ${name(step.units[0])} را می‌بندد و جایی برایش نمی‌ماند. پس این خانه تاج ندارد.`,
      };
    case 'group': {
      const k = step.units.length / 2;
      const first = list(step.units.slice(0, k).map(name), 'fa');
      const second = list(step.units.slice(k).map(name), 'fa');
      return {
        title: `${k} تا در ${k} تا`,
        body: `${first} فقط در ${second} خانه‌ی باز دارند. این ${k} تا باید همان ${k} تاج را بین خودشان تقسیم کنند، پس بقیه‌ی خانه‌های باز ${second} ✕ می‌خورند.`,
      };
    }
    case 'contradiction':
      return {
        title: 'اگر اینجا تاج بود…؟',
        body: `فرض کن در خانه‌ی مشخص‌شده تاج بگذاری. با قانون‌های ساده، ${name(step.units[0])} دیگر جایی برای تاج ندارد. پس این خانه باید خالی بماند.`,
      };
  }
}

function explainStepAr(step: Step, opts: ExplainOptions): Explanation {
  const name = (u: UnitRef) => unitName(u, opts);
  switch (step.rule) {
    case 'lastCell': {
      // "Region" is feminine in Arabic, rows and columns are masculine.
      const fem = step.units[0].kind === 'region';
      return {
        title: 'بقي مكان واحد',
        body: `${name(step.units[0])} ${fem ? 'فيها' : 'فيه'} خانة مفتوحة واحدة فقط، ${fem ? 'فتاجها' : 'فتاجه'} هناك.`,
      };
    }
    case 'confinement': {
      const [a, b] = step.units;
      if (a.kind === 'region') {
        return {
          title: 'منطقة محصورة في خط واحد',
          body: `كل الخانات المفتوحة في ${name(a)} تقع في ${name(b)}. تاجها يجب أن يكون هناك، لذا تُستبعد بقية خانات ${name(b)}.`,
        };
      }
      return {
        title: 'خط تملكه منطقة واحدة',
        body: `كل الخانات المفتوحة في ${name(a)} تنتمي إلى ${name(b)}. تاج هذا الخط يأتي من ${name(b)}، لذا تُستبعد بقية ${name(b)}.`,
      };
    }
    case 'blocksUnit':
      return {
        title: 'هذه الخانة تُغلق الكثير',
        body: `تاج في الخانة المميزة سيغطي كل الخانات المفتوحة في ${name(step.units[0])}، فلا يبقى هناك مكان لتاج. لذا لا يمكن أن يكون هنا تاج.`,
      };
    case 'group': {
      const k = step.units.length / 2;
      const first = list(step.units.slice(0, k).map(name), 'ar');
      const second = list(step.units.slice(k).map(name), 'ar');
      return {
        title: `${k} في ${k}`,
        body: `${first}: خاناتها المفتوحة كلها في ${second}. هذه الـ${k} تتقاسم تلك التيجان الـ${k}، لذا تُستبعد كل خانة مفتوحة أخرى في ${second}.`,
      };
    }
    case 'contradiction':
      return {
        title: 'ماذا لو…؟',
        body: `تخيّل تاجًا في الخانة المميزة. باتباع القواعد البسيطة، لن يبقى مكان لتاج في ${name(step.units[0])}. لذا يجب أن تبقى هذه الخانة فارغة.`,
      };
  }
}

function explainStepRu(step: Step): Explanation {
  const nom = (u: UnitRef) => ruUnit(u, 'nom');
  const gen = (u: UnitRef) => ruUnit(u, 'gen');
  const prep = (u: UnitRef) => ruUnit(u, 'prep');
  // «в ряду / в столбце / в … области»
  const inUnit = (u: UnitRef) => `в ${prep(u)}`;
  switch (step.rule) {
    case 'lastCell':
      return { title: 'Осталось одно место', body: `${inUnit(step.units[0]).replace(/^в/, 'В')} осталась только одна свободная клетка, значит корона там.` };
    case 'confinement': {
      const [a, b] = step.units;
      if (a.kind === 'region') {
        return {
          title: 'Область в одной линии',
          body: `Все свободные клетки ${gen(a)} лежат ${inUnit(b)}. Её корона должна быть там, поэтому остальные клетки ${gen(b)} можно зачеркнуть.`,
        };
      }
      return {
        title: 'Линия одной области',
        body: `Все свободные клетки ${gen(a)} принадлежат: ${nom(b)}. Корона этой линии будет ${inUnit(b)}, поэтому остальные клетки ${gen(b)} можно зачеркнуть.`,
      };
    }
    case 'blocksUnit':
      return {
        title: 'Эта клетка мешает слишком многому',
        body: `Корона на выделенной клетке закрыла бы все свободные клетки ${gen(step.units[0])}, и для короны там не осталось бы места. Значит, здесь короны быть не может.`,
      };
    case 'group': {
      const k = step.units.length / 2;
      const first = list(step.units.slice(0, k).map(nom), 'ru');
      const second = list(step.units.slice(k).map(prep), 'ru');
      return {
        title: `${k} в ${k}`,
        body: `${cap(first)}: все их свободные клетки лежат в ${second}. Эти ${k} делят между собой ${k} ${k >= 2 && k <= 4 ? 'короны' : 'корон'}, поэтому все остальные свободные клетки там зачёркиваются.`,
      };
    }
    case 'contradiction':
      return {
        title: 'А что если…?',
        body: `Представьте корону на выделенной клетке. По простым правилам ${inUnit(step.units[0])} не останется места для короны. Значит, эта клетка должна быть пустой.`,
      };
  }
}

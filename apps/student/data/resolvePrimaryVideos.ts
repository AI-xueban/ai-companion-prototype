import { PRIMARY_VIDEO_SAMPLES, type PrimaryVideoSample } from './primaryVideoSamples';

const PACK_PRIORITY: Record<string, string[]> = {
  语文: ['人教版-小学-语文-六年级-上学期-26版'],
  数学: ['北师大-小学-数学-六年级-上学期-26版', '北师大-小学-数学-六年级-上学期-15版'],
  英语: ['沪教版-小学-英语-六年级-上学期-14版', '沪教版-小学-英语-六年级-上学期-26版'],
};

function compact(value: string) {
  return value
    .replace(/[　\s]/g, '')
    .replace(/[（）()【】]/g, '')
    .replace(/[[\]]/g, '')
    .replace(/[·•]/g, '')
    .replace(/[_—－-]/g, '')
    .toLowerCase();
}

function splitSectionHint(sectionLabel: string) {
  const [base, ...rest] = sectionLabel.split('_');
  return {
    base: base.trim(),
    extra: rest.join('_').trim(),
  };
}

function unitKey(value: string) {
  const unit = value.match(/Unit\s*(\d+)/i);
  if (unit) return `u${unit[1]}`;
  const cn = value.match(/第([一二三四五六七八九十]+)单元/);
  if (cn) return `c${cn[1]}`;
  const leading = value.match(/^(\d+)\b/);
  if (leading) return `u${leading[1]}`;
  return '';
}

function sectionMatches(sample: PrimaryVideoSample, sectionLabel: string, extra: string) {
  if (!sample.section) return false;
  const sampleSection = compact(sample.section);
  const label = compact(sectionLabel);
  if (!sampleSection || !label) return false;
  if (sampleSection === label) return true;
  if (label.startsWith(sampleSection) || sampleSection.startsWith(label)) return true;
  if (extra && compact(sample.title).includes(compact(extra))) return true;
  return false;
}

function unitMatches(sample: PrimaryVideoSample, chapterLabel: string, sectionLabel: string) {
  const sampleUnit = compact(sample.unit);
  if (!sampleUnit) return false;
  if (sampleUnit === compact(chapterLabel) || sampleUnit === compact(sectionLabel)) return true;
  const sampleKey = unitKey(sample.unit);
  return Boolean(
    sampleKey && (sampleKey === unitKey(chapterLabel) || sampleKey === unitKey(sectionLabel))
  );
}

function matchVideos(
  samples: PrimaryVideoSample[],
  chapterLabel: string,
  sectionLabel: string
) {
  const { base, extra } = splitSectionHint(sectionLabel);
  const bySection = samples.filter((sample) => sectionMatches(sample, base || sectionLabel, extra));
  const scoped = extra
    ? bySection.filter((sample) => compact(sample.title).includes(compact(extra)))
    : bySection;
  if (scoped.length) return scoped;

  const unitOnly = samples.filter((sample) => !sample.section);
  return unitOnly.filter((sample) => unitMatches(sample, chapterLabel, sectionLabel));
}

export function resolveLessonSampleVideos(options: {
  subject: string;
  chapterLabel: string;
  sectionLabel: string;
}): PrimaryVideoSample[] {
  const { subject, chapterLabel, sectionLabel } = options;
  if (!sectionLabel && !chapterLabel) return [];

  const packs = PACK_PRIORITY[subject] || [];
  for (const pack of packs) {
    const matched = matchVideos(
      PRIMARY_VIDEO_SAMPLES.filter((item) => item.pack === pack),
      chapterLabel,
      sectionLabel
    );
    if (matched.length) return matched;
  }

  return matchVideos(
    PRIMARY_VIDEO_SAMPLES.filter((item) => item.subject === subject && !packs.includes(item.pack)),
    chapterLabel,
    sectionLabel
  );
}

export function tagsMatch(sampleTag: string, moduleTitle: string) {
  if (!sampleTag || !moduleTitle) return false;
  if (sampleTag === moduleTitle) return true;
  const sample = compact(sampleTag);
  const title = compact(moduleTitle);
  if (sample === title) return true;
  if (title.length >= 2 && sample.includes(title)) return true;
  if (sample.length >= 2 && title.includes(sample)) return true;
  if (title.includes('53') && sample.includes('名师带你学')) return true;
  return false;
}

export function findSampleVideoTitle(samples: PrimaryVideoSample[], moduleTitle: string) {
  return samples.find((sample) => tagsMatch(sample.tag, moduleTitle))?.title || '';
}

import { profile, socialLinks, summary } from '../data/profile';

// 表示と同じ情報だけを使う。本人の識別子は記事の著者からも参照する。
export const person = {
  '@type': 'Person',
  '@id': `${profile.url}#person`,
  name: profile.name,
  alternateName: [profile.name.replace(/\s/g, ''), profile.handle, profile.account, profile.reading],
  url: profile.url,
  image: new URL(profile.image, profile.url).href,
  description: summary,
  affiliation: { '@type': 'CollegeOrUniversity', name: profile.university },
  sameAs: Object.values(socialLinks),
};

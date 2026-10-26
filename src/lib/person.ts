import { profile, socialLinks, summary } from '../data/profile';
import { projects } from '../data/projects';

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
  // 他者の報告は本人アカウントとして同一視せず、本人が記載された文書として参照する。
  subjectOf: projects.flatMap((project) =>
    project.report
      ? [
          {
            '@type': 'WebPage',
            name: project.report.title,
            url: project.report.url,
            publisher: { '@type': 'Organization', name: project.report.publisher },
          },
        ]
      : [],
  ),
};

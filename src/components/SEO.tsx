import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}

const defaults = {
  title: 'Ian Alloway | Sports ML & Evaluation · ML Engineer',
  description: 'ML engineer focused on sports analytics, calibration-first evaluation, and production Python (FastAPI, test-backed primitives). Public flagship: NBA CLV dashboard + nba-edge library. MS AI candidate at USF.',
  url: 'https://ianalloway.xyz',
  image: '/og-image.png',
  siteName: 'Ian Alloway',
};

export default function SEO({ title, description, path = '', image }: SEOProps) {
  const pageTitle = title ? `${title} | Ian Alloway` : defaults.title;
  const pageDescription = description || defaults.description;
  const pageUrl = `${defaults.url}${path}`;
  const pageImage = image || `${defaults.url}${defaults.image}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={defaults.siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'Ian Alloway',
          url: defaults.url,
          jobTitle: 'ML Engineer — Sports analytics & model evaluation',
          alumniOf: {
            '@type': 'CollegeOrUniversity',
            name: 'University of South Florida',
          },
          knowsAbout: [
            'Machine Learning',
            'Data Science',
            'Python',
            'XGBoost',
            'AI Agents',
            'Sports Analytics',
            'Natural Language Processing',
          ],
          sameAs: [
            'https://github.com/ianalloway',
            'https://linkedin.com/in/ianit',
            'https://allowayai.substack.com',
          ],
        })}
      </script>

      {/* Misc */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Ian Alloway" />
      <meta name="keywords" content="Ian Alloway, AI Engineer, Data Scientist, ML Engineer, Machine Learning, Portfolio, USF, Sports Analytics, AI Agents, XGBoost, Python, React" />
      <meta name="theme-color" content="#0f172a" />
    </Helmet>
  );
}

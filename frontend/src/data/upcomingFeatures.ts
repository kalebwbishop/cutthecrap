export interface UpcomingFeature {
  title: string;
  description: string;
}

export const FREE_FEATURES: UpcomingFeature[] = [
  {
    title: 'Improved Recipe Parsing',
    description: 'Better accuracy when extracting recipes from a wider range of websites.',
  },
  {
    title: 'Ingredient Unit Conversion',
    description: 'Easily convert between metric and imperial measurements.',
  },
  {
    title: 'Recipe Sharing',
    description: 'Share extracted recipes with friends and family via a link.',
  },
  {
    title: 'More Website Support',
    description: 'Expanding compatibility to support even more recipe sources.',
  },
];

export const PRO_FEATURES: UpcomingFeature[] = [
  {
    title: 'Meal Planning',
    description: 'Plan your weekly meals and auto-generate grocery lists from saved recipes.',
  },
  {
    title: 'Nutritional Information',
    description: 'See estimated calories, macros, and nutritional data for each recipe.',
  },
  {
    title: 'Recipe Collections',
    description: 'Organize saved recipes into custom folders and collections.',
  },
  {
    title: 'AI Recipe Suggestions',
    description: 'Get personalized recipe recommendations based on your saved favorites.',
  },
  {
    title: 'Export to PDF',
    description: 'Download any recipe as a clean, printable PDF.',
  },
  {
    title: 'Offline Access',
    description: 'Access your saved recipes even without an internet connection.',
  },
];

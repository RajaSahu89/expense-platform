import { Category } from '@prisma/client';
export function categorizeTransaction(
  text: string,
  categories: Pick<Category, 'id' | 'name' | 'keywords'>[]
): string | null {
  const normalized = text.toLowerCase();
  let bestMatch: { id: string; score: number } | null = null;

  for (const category of categories) {
    const keywords = category.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    let score = 0;
    for (const keyword of keywords) {
      if (matchesKeyword(normalized, keyword)) score += 1 + keyword.length / 100;
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: category.id, score };
    }
  }

  return bestMatch?.id ?? null;
}
function matchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(text);
}
export const DEFAULT_CATEGORIES: Array<{
  name: string;
  color: string;
  icon: string;
  keywords: string;
}> = [
  { name: 'Groceries', color: '#2FBF8F', icon: 'shopping-cart', keywords: 'bigbasket,dmart,grocery,supermarket,reliance fresh,more,spencer' },
  { name: 'Dining', color: '#FF8A65', icon: 'utensils', keywords: 'restaurant,cafe,coffee,swiggy,zomato,dominos,mcdonald,starbucks' },
  { name: 'Transportation', color: '#E0A93A', icon: 'car', keywords: 'uber,ola,rapido,petrol,diesel,indian oil,hp petrol,parking,metro,irctc' },
  { name: 'Housing', color: '#94A3B8', icon: 'home', keywords: 'rent,maintenance,society,landlord' },
  { name: 'Utilities', color: '#7DA6D9', icon: 'zap', keywords: 'electricity,water bill,gas cylinder,broadband,airtel,jio,vodafone,bsnl,utility' },
  { name: 'Subscriptions', color: '#A78BFA', icon: 'repeat', keywords: 'netflix,spotify,hotstar,prime video,subscription,youtube premium,icloud' },
  { name: 'Entertainment', color: '#F472B6', icon: 'film', keywords: 'movie,pvr,inox,theater,concert,bookmyshow,steam,playstation' },
  { name: 'Health', color: '#34D399', icon: 'heart', keywords: 'pharmacy,apollo,medplus,doctor,clinic,dental,gym,cult.fit,fitness' },
  { name: 'Shopping', color: '#D9A066', icon: 'bag', keywords: 'amazon,flipkart,myntra,ajio,mall,reliance digital' },
  { name: 'Income', color: '#2FBF8F', icon: 'trending-up', keywords: 'salary,payroll,deposit,refund,reimbursement,neft,imps' },
  { name: 'Other', color: '#94A3B8', icon: 'circle', keywords: '' },
];

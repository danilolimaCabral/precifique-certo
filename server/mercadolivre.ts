// Mercado Livre API Integration Service

const ML_API_BASE = "https://api.mercadolibre.com";
const ML_AUTH_BASE = "https://auth.mercadolivre.com.br";

export interface MlListingPrice {
  currency_id: string;
  listing_exposure: string;
  listing_fee_amount: number;
  listing_type_id: string;
  listing_type_name: string;
  sale_fee_amount: number;
  sale_fee_details: {
    percentage_fee: number;
    fixed_fee: number;
    gross_amount: number;
    meli_percentage_fee?: number;
    financing_add_on_fee?: number;
  };
}

export interface MlTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export interface MlCategory {
  id: string;
  name: string;
}

// Generate authorization URL for OAuth flow
export function getAuthorizationUrl(clientId: string, redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
  });
  if (state) params.append("state", state);
  return `${ML_AUTH_BASE}/authorization?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<MlTokenResponse> {
  const response = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to exchange code: ${response.status}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<MlTokenResponse> {
  const response = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to refresh token: ${response.status}`);
  }

  return response.json();
}

// Get listing prices/fees from Mercado Livre API
export async function getListingPrices(
  accessToken: string,
  price: number,
  categoryId?: string,
  listingTypeId?: string
): Promise<MlListingPrice[]> {
  const params = new URLSearchParams({
    price: price.toString(),
  });
  if (categoryId) params.append("category_id", categoryId);
  if (listingTypeId) params.append("listing_type_id", listingTypeId);

  const response = await fetch(
    `${ML_API_BASE}/sites/MLB/listing_prices?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to get listing prices: ${response.status}`);
  }

  return response.json();
}

// Get user info to verify connection
export async function getUserInfo(accessToken: string) {
  const response = await fetch(`${ML_API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to get user info: ${response.status}`);
  }

  return response.json();
}

// Get categories from Mercado Livre
export async function getCategories(): Promise<MlCategory[]> {
  const response = await fetch(`${ML_API_BASE}/sites/MLB/categories`);
  
  if (!response.ok) {
    throw new Error(`Failed to get categories: ${response.status}`);
  }

  return response.json();
}

// Map ML listing type to our marketplace names
export function mapListingTypeToMarketplace(listingTypeId: string): string {
  const mapping: Record<string, string> = {
    "gold_pro": "Mercado Livre Premium",
    "gold_special": "Mercado Livre Clássico",
    "gold_premium": "Mercado Livre Premium",
    "free": "Mercado Livre Gratuito",
  };
  return mapping[listingTypeId] || `Mercado Livre (${listingTypeId})`;
}

// Extract commission percentage from ML response
export function extractCommissionPercent(priceData: MlListingPrice): number {
  if (priceData.sale_fee_details?.percentage_fee) {
    return priceData.sale_fee_details.percentage_fee;
  }
  // Calculate from sale_fee_amount if percentage not available
  return 0;
}

// Sync commissions from ML to our marketplace records
export interface SyncResult {
  success: boolean;
  updated: number;
  errors: string[];
  details: {
    listingType: string;
    commissionPercent: number;
    fixedFee: number;
  }[];
}

export async function syncCommissionsFromML(
  accessToken: string,
  referencePrice: number = 100
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    updated: 0,
    errors: [],
    details: [],
  };

  try {
    const prices = await getListingPrices(accessToken, referencePrice);
    
    for (const price of prices) {
      // Only process active listing types
      if (price.listing_type_id === "gold_pro" || price.listing_type_id === "gold_special") {
        const commissionPercent = extractCommissionPercent(price);
        const fixedFee = price.sale_fee_details?.fixed_fee || 0;
        
        result.details.push({
          listingType: price.listing_type_name,
          commissionPercent,
          fixedFee,
        });
        result.updated++;
      }
    }
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message || "Unknown error");
  }

  return result;
}

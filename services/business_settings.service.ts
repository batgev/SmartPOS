import { getDatabase } from "../database/sqlite";

export type BusinessSettings = {
  id: number;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  receiptFooter: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateBusinessSettingsInput = {
  businessName: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  receiptFooter?: string;
};

class BusinessSettingsService {
  /**
   * Get the business settings.
   *
   * SmartPOS has one business per installation,
   * therefore the settings record always has id = 1.
   */
  async getSettings(): Promise<BusinessSettings> {
    const db = await getDatabase();

    const settings =
      await db.getFirstAsync<BusinessSettings>(
        `
        SELECT
          id,
          business_name AS businessName,
          address,
          phone,
          email,
          currency,
          receipt_footer AS receiptFooter,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM business_settings
        WHERE id = 1
        LIMIT 1;
        `
      );

    if (!settings) {
      throw new Error(
        "Business settings have not been initialized."
      );
    }

    return settings;
  }

  /**
   * Update the business settings.
   *
   * The UI will only expose this functionality to admins.
   */
  async updateSettings(
    data: UpdateBusinessSettingsInput
  ): Promise<void> {
    const db = await getDatabase();

    const businessName =
      data.businessName.trim();

    if (!businessName) {
      throw new Error(
        "Business name is required."
      );
    }

    const address =
      data.address?.trim() ?? "";

    const phone =
      data.phone?.trim() ?? "";

    const email =
      data.email?.trim() ?? "";

    const currency =
      data.currency?.trim() || "GH₵";

    const receiptFooter =
      data.receiptFooter?.trim() ||
      "Thank you for your business.";

    await db.runAsync(
      `
      UPDATE business_settings
      SET
        business_name = ?,
        address = ?,
        phone = ?,
        email = ?,
        currency = ?,
        receipt_footer = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1;
      `,
      [
        businessName,
        address,
        phone,
        email,
        currency,
        receiptFooter,
      ]
    );

    console.log(
      "✅ BUSINESS SETTINGS UPDATED"
    );
  }
}

export default new BusinessSettingsService();
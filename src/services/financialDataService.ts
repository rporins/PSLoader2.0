import { API_BASE_URL } from '../config';
import authService from './auth';

export interface FinancialDataRecord {
  id: number;
  ou: string;
  period: string;
  department: string;
  account: string;
  amount: number;
  scenario: 'Actuals' | 'Budget' | 'Forecast';
  version: string;
  currency: string;
  load_id: string;
  load_date: string;
}

class FinancialDataService {
  /**
   * Fetch financial data from the API for a given OU
   */
  async fetchFinancialData(ou: string): Promise<FinancialDataRecord[]> {
    const accessToken = authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/act-bud-fcst-data/?ou=${ou}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied to this OU');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch financial data');
    }

    const data = await response.json();
    return data;
  }

  /**
   * Import financial data from API and store locally
   */
  async importFinancialData(ou: string): Promise<{ success: boolean; count: number; message: string }> {
    try {
      // Fetch data from API
      const records = await this.fetchFinancialData(ou);

      if (!records || records.length === 0) {
        return {
          success: true,
          count: 0,
          message: 'No financial data found for this OU'
        };
      }

      // Store data in local database via IPC
      if (typeof window !== 'undefined' && window.ipcApi) {
        await window.ipcApi.sendIpcRequest('db:store-financial-data', {
          ou,
          records
        });

        return {
          success: true,
          count: records.length,
          message: `Successfully imported ${records.length} financial records`
        };
      } else {
        throw new Error('IPC API not available');
      }
    } catch (error: any) {
      console.error('Failed to import financial data:', error);
      throw error;
    }
  }

  /**
   * Get stored financial data count for an OU
   */
  async getStoredDataCount(ou: string): Promise<number> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const response = await window.ipcApi.sendIpcRequest('db:get-financial-data-count', { ou });
        return response.data || 0;
      } catch (error) {
        console.warn('Failed to get stored data count:', error);
        return 0;
      }
    }
    return 0;
  }

  /**
   * Get last import timestamp for an OU
   */
  async getLastImportTimestamp(ou: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const response = await window.ipcApi.sendIpcRequest('db:get-financial-data-last-import', { ou });
        return response.data || null;
      } catch (error) {
        console.warn('Failed to get last import timestamp:', error);
        return null;
      }
    }
    return null;
  }
}

export default new FinancialDataService();

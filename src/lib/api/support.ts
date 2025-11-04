/**
 * Support Ticket API Service
 * Handles contact support form submissions
 */

import apiClient, { getErrorMessage } from './client';

export interface SupportTicket {
  id?: string;
  name: string;
  email: string;
  message: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at?: string;
}

export interface SubmitTicketResponse {
  id: string;
  message: string;
}

class SupportService {
  /**
   * Submit a new support ticket
   */
  async submitTicket(ticket: Omit<SupportTicket, 'id' | 'status' | 'created_at'>): Promise<SubmitTicketResponse> {
    try {
      const { data } = await apiClient.post<{
        success: boolean;
        data: SubmitTicketResponse;
      }>('/support/tickets', ticket);
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get user's support tickets (optional - for viewing history)
   */
  async getMyTickets(): Promise<SupportTicket[]> {
    try {
      const { data } = await apiClient.get<{
        success: boolean;
        data: SupportTicket[];
      }>('/support/tickets');
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const supportService = new SupportService();

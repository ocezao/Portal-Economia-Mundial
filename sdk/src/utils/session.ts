/**
 * Gerenciamento de sessão de usuário
 */

import { generateUUID } from './device';

const USER_ID_KEY = '__pem_uid';
const SESSION_ID_KEY = '__pem_sid';
const SESSION_START_KEY = '__pem_sid_start';

export class SessionManager {
  private sessionTimeoutMinutes: number;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private sessionStart: number = 0;

  constructor(sessionTimeoutMinutes: number = 30) {
    this.sessionTimeoutMinutes = sessionTimeoutMinutes;
  }

  /**
   * Inicializa a sessão a partir do storage
   */
  init(): void {
    this.loadFromStorage();
    
    // Verificar se sessão expirou
    if (this.sessionId && this.isSessionExpired()) {
      this.renewSession();
    }
  }

  /**
   * Retorna o user ID atual
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Retorna o session ID atual
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Garante que existe um user ID
   */
  ensureUserId(): string {
    if (!this.userId) {
      this.userId = generateUUID();
      this.saveToStorage();
    }
    return this.userId;
  }

  /**
   * Garante que existe um session ID
   */
  ensureSessionId(): string {
    if (!this.sessionId || this.isSessionExpired()) {
      this.renewSession();
    }
    return this.sessionId!;
  }

  /**
   * Renova a sessão atual
   */
  renewSession(): string {
    this.sessionId = generateUUID();
    this.sessionStart = Date.now();
    this.saveToStorage();
    return this.sessionId;
  }

  /**
   * Limpa todos os identificadores
   */
  clearIdentifiers(): void {
    this.userId = null;
    this.sessionId = null;
    this.sessionStart = 0;
    
    // Limpar cookies
    document.cookie = `${USER_ID_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    document.cookie = `${SESSION_ID_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    document.cookie = `${SESSION_START_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Retorna a duração da sessão atual em segundos
   */
  getSessionDurationSeconds(): number {
    if (!this.sessionStart) return 0;
    return Math.floor((Date.now() - this.sessionStart) / 1000);
  }

  /**
   * Atualiza o timestamp da sessão (heartbeat)
   */
  touchSession(): void {
    if (this.sessionId) {
      this.sessionStart = Date.now();
      this.saveToStorage();
    }
  }

  // ========== Métodos privados ==========

  private loadFromStorage(): void {
    const uidCookie = this.getCookie(USER_ID_KEY);
    const sidCookie = this.getCookie(SESSION_ID_KEY);
    const startCookie = this.getCookie(SESSION_START_KEY);

    if (uidCookie) this.userId = uidCookie;
    if (sidCookie) this.sessionId = sidCookie;
    if (startCookie) this.sessionStart = parseInt(startCookie, 10);
  }

  private saveToStorage(): void {
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    
    if (this.userId) {
      document.cookie = `${USER_ID_KEY}=${this.userId};expires=${expires};path=/;SameSite=Lax`;
    }
    if (this.sessionId) {
      document.cookie = `${SESSION_ID_KEY}=${this.sessionId};expires=${expires};path=/;SameSite=Lax`;
    }
    if (this.sessionStart) {
      document.cookie = `${SESSION_START_KEY}=${this.sessionStart};expires=${expires};path=/;SameSite=Lax`;
    }
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private isSessionExpired(): boolean {
    if (!this.sessionStart) return true;
    const elapsed = (Date.now() - this.sessionStart) / 1000 / 60; // minutos
    return elapsed > this.sessionTimeoutMinutes;
  }
}

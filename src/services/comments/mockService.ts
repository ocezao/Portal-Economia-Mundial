/**
 * Serviço Mock de Comentários
 * Implementação LocalStorage para demonstração
 * Facilmente substituível por API real
 */

import { storage } from '@/config/storage';
import type {
  Comment,
  CreateCommentDTO,
  UpdateCommentDTO,
  DeleteCommentDTO,
  CommentFilter,
  ICommentService,
  CommentValidationResult,
} from './types';

const COMMENTS_KEY = 'pem_comments';
const LAST_SUBMIT_KEY = 'pem_last_comment_submit';

// Lista de palavras sensíveis (configurável)
const SENSITIVE_WORDS = [
  'spam', 'ofensiva', 'xingamento', 'palavrão',
  'propaganda', 'golpe', 'fraude', 'fake',
];

// Limites de validação
const VALIDATION_LIMITS = {
  minLength: 10,
  maxLength: 1000,
  submitCooldown: 30000, // 30 segundos entre comentários
};

class MockCommentService implements ICommentService {
  private getCommentsFromStorage(): Comment[] {
    return storage.get<Comment[]>(COMMENTS_KEY) || [];
  }

  private saveCommentsToStorage(comments: Comment[]): void {
    storage.set(COMMENTS_KEY, comments);
  }

  private generateId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validação de conteúdo
  validateContent(content: string): CommentValidationResult {
    const errors: string[] = [];
    const trimmed = content.trim();

    if (trimmed.length < VALIDATION_LIMITS.minLength) {
      errors.push(`Comentário deve ter pelo menos ${VALIDATION_LIMITS.minLength} caracteres`);
    }

    if (trimmed.length > VALIDATION_LIMITS.maxLength) {
      errors.push(`Comentário deve ter no máximo ${VALIDATION_LIMITS.maxLength} caracteres`);
    }

    // Verificar palavras sensíveis
    const lowerContent = trimmed.toLowerCase();
    const foundWords = SENSITIVE_WORDS.filter(word => lowerContent.includes(word));
    if (foundWords.length > 0) {
      errors.push('Comentário contém termos inadequados');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Verificar cooldown de submissão
  canSubmit(): { allowed: boolean; remainingSeconds: number } {
    const lastSubmit = storage.get<number>(LAST_SUBMIT_KEY) || 0;
    const now = Date.now();
    const elapsed = now - lastSubmit;

    if (elapsed < VALIDATION_LIMITS.submitCooldown) {
      return {
        allowed: false,
        remainingSeconds: Math.ceil((VALIDATION_LIMITS.submitCooldown - elapsed) / 1000),
      };
    }

    return { allowed: true, remainingSeconds: 0 };
  }

  // Buscar comentários
  async getComments(filter: CommentFilter): Promise<Comment[]> {
    const allComments = this.getCommentsFromStorage();
    let filtered = allComments.filter(
      c => c.articleSlug === filter.articleSlug && !c.isDeleted
    );

    // Ordenação
    if (filter.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // newest (padrão)
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }

  // Criar comentário
  async createComment(
    dto: CreateCommentDTO,
    author: { id: string; name: string; avatar?: string }
  ): Promise<Comment> {
    // Verificar cooldown
    const submitCheck = this.canSubmit();
    if (!submitCheck.allowed) {
      throw new Error(`Aguarde ${submitCheck.remainingSeconds} segundos para comentar novamente`);
    }

    // Validar conteúdo
    const validation = this.validateContent(dto.content);
    if (!validation.valid) {
      throw new Error(validation.errors.join('. '));
    }

    const newComment: Comment = {
      id: this.generateId(),
      articleSlug: dto.articleSlug,
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      content: dto.content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      isDeleted: false,
    };

    const comments = this.getCommentsFromStorage();
    comments.push(newComment);
    this.saveCommentsToStorage(comments);

    // Registrar timestamp de submissão
    storage.set(LAST_SUBMIT_KEY, Date.now());

    return newComment;
  }

  // Atualizar comentário
  async updateComment(dto: UpdateCommentDTO): Promise<Comment | null> {
    const validation = this.validateContent(dto.content);
    if (!validation.valid) {
      throw new Error(validation.errors.join('. '));
    }

    const comments = this.getCommentsFromStorage();
    const index = comments.findIndex(c => c.id === dto.commentId);

    if (index === -1) return null;

    comments[index] = {
      ...comments[index],
      content: dto.content.trim(),
      updatedAt: new Date().toISOString(),
    };

    this.saveCommentsToStorage(comments);
    return comments[index];
  }

  // Deletar comentário (soft delete)
  async deleteComment(dto: DeleteCommentDTO): Promise<boolean> {
    const comments = this.getCommentsFromStorage();
    const index = comments.findIndex(c => c.id === dto.commentId);

    if (index === -1) return false;

    // Verificar permissão
    if (comments[index].authorId !== dto.authorId) {
      throw new Error('Você não tem permissão para excluir este comentário');
    }

    comments[index] = {
      ...comments[index],
      isDeleted: true,
      content: '[Comentário removido]',
    };

    this.saveCommentsToStorage(comments);
    return true;
  }

  // Verificar se usuário pode deletar comentário
  canDeleteComment(comment: Comment, userId: string): boolean {
    return comment.authorId === userId && !comment.isDeleted;
  }
}

// Singleton instance
export const commentService = new MockCommentService();

/**
 * Tipos do Sistema de Comentários
 * Interface para futura integração com backend
 */

export interface Comment {
  id: string;
  articleSlug: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  isDeleted: boolean;
}

export interface CreateCommentDTO {
  articleSlug: string;
  content: string;
}

export interface UpdateCommentDTO {
  commentId: string;
  content: string;
}

export interface DeleteCommentDTO {
  commentId: string;
  authorId: string;
}

export interface CommentFilter {
  articleSlug: string;
  sortBy?: 'newest' | 'oldest';
}

export interface CommentValidationResult {
  valid: boolean;
  errors: string[];
}

// Interface para implementação do serviço (mock ou API real)
export interface ICommentService {
  getComments(filter: CommentFilter): Promise<Comment[]>;
  createComment(dto: CreateCommentDTO, author: { id: string; name: string }): Promise<Comment>;
  updateComment(dto: UpdateCommentDTO): Promise<Comment | null>;
  deleteComment(dto: DeleteCommentDTO): Promise<boolean>;
  canDeleteComment(comment: Comment, userId: string): boolean;
}

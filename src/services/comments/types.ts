/**
 * Tipos para o sistema de comentários
 */

export interface Comment {
  id: string;
  articleSlug: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  likes?: number;
  parentId?: string | null;
  isDeleted?: boolean;
}

export interface GetCommentsParams {
  articleSlug: string;
  sortBy?: 'newest' | 'oldest' | 'popular';
  limit?: number;
  offset?: number;
}

export interface CreateCommentParams {
  articleSlug: string;
  content: string;
  parentId?: string | null;
}

export interface DeleteCommentParams {
  commentId: string;
  authorId: string;
}

export interface UpdateCommentParams {
  commentId: string;
  content: string;
}

export interface CommentService {
  getComments(params: GetCommentsParams): Promise<Comment[]>;
  createComment(params: CreateCommentParams, author: Comment['author']): Promise<Comment>;
  deleteComment(params: DeleteCommentParams): Promise<void>;
  updateComment(commentId: string, content: string): Promise<Comment>;
  likeComment(commentId: string, userId: string): Promise<void>;
}

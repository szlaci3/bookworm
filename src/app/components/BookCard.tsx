import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import type { Book } from '../../types/books';
import { bookCoverUrl } from '../../utils/bookCover';

const CardLink = styled(Link)({
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
});

const Metadata = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--space-2)',
});

const CardAction = styled.button({
  fontSize: '0.8rem',
  padding: 'var(--space-1) var(--space-2)',
});

interface BookCardProps {
  book: Book;
  action: 'Save' | 'Saved' | 'Remove';
  onAction: () => void;
}

export function BookCard({ book, action, onAction }: BookCardProps) {
  const cover = bookCoverUrl(book.coverId);
  return (
    <article className="book-card">
      <CardLink to={`/books/${book.id}`} state={{ book }}>
        <div className="book-card__main">
          <div className="book-card__thumbnail">
            {cover ? <img src={cover} alt="" loading="lazy" />
              : <div className="book-card__thumbnail-placeholder" aria-hidden="true">📚</div>}
          </div>
          <div className="book-card__info">
            <div className="book-card__title">{book.title}</div>
            <div className="book-card__author">{book.authors.join(', ') || 'Unknown Author'}</div>
          </div>
        </div>
      </CardLink>
      <Metadata className="book-card__meta">
        <span>{book.firstPublishYear ? `First published: ${book.firstPublishYear}` : 'Publication year unknown'}</span>
        <CardAction type="button" className={`btn ${action === 'Save' ? 'btn-primary' : 'btn-secondary btn-light'}`}
          aria-pressed={action === 'Remove' ? undefined : action === 'Saved'} onClick={onAction}>{action}</CardAction>
      </Metadata>
    </article>
  );
}

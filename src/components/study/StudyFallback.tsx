import { chapters, shelfBooks } from '../../data/library';
import { toggleLighting } from './actions';
import { useStudy } from './store';

/**
 * The study drawn flat in HTML and CSS, for devices without WebGL or visitors
 * who choose the simple view. Same window, book, shelf and lamp; same links.
 */
export function StudyFallback() {
	const preset = useStudy((s) => s.preset);
	const open = useStudy((s) => s.controlsOpen);
	return (
		<div className="flat-study" data-preset={preset}>
			<div className="flat-study__window" aria-hidden="true">
				<span className="flat-study__glass" />
			</div>
			<div className="flat-study__shelf">
				<p className="flat-study__caption">From the shelf</p>
				<ul className="flat-study__spines">
					{shelfBooks.map((book) => (
						<li key={book.slug}>
							<a
								href={`/work/${book.slug}`}
								className="flat-spine"
								style={{ '--cloth': book.cloth, '--foil': book.foil } as React.CSSProperties}
							>
								<span className="flat-spine__title">{book.spine}</span>
								<span className="sr-only">: {book.subtitle}</span>
							</a>
						</li>
					))}
				</ul>
			</div>
			<div className="flat-study__desk">
				<button
					type="button"
					className="flat-lamp"
					aria-expanded={open}
					aria-controls="lighting-controls"
					onClick={() => toggleLighting()}
				>
					<span className="flat-lamp__shade" aria-hidden="true" />
					<span className="flat-lamp__stem" aria-hidden="true" />
					<span className="flat-lamp__label">Lighting</span>
				</button>
				<nav className="flat-book" aria-label="Contents">
					<div className="flat-book__page flat-book__page--left">
						<p className="small-caps">The study of</p>
						<p className="flat-book__name">Yvonne Wu</p>
						<p className="flat-book__role">UX &amp; UI Designer</p>
					</div>
					<div className="flat-book__page flat-book__page--right">
						<p className="flat-book__contents">Contents</p>
						<ol>
							{chapters.map((chapter) => (
								<li key={chapter.href}>
									<a href={chapter.href} aria-current={chapter.href === '/' ? 'page' : undefined}>
										<span className="flat-book__num">{chapter.number}</span>
										<span className="flat-book__label">{chapter.label}</span>
										<span className="flat-book__dots" aria-hidden="true" />
										<span className="flat-book__pg" aria-hidden="true">
											{chapter.page}
										</span>
									</a>
								</li>
							))}
						</ol>
					</div>
				</nav>
			</div>
		</div>
	);
}

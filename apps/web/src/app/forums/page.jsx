import Link from 'next/link';
import { api } from '@/lib/api';

export const metadata = { title: 'Forums' };

export default async function ForumsPage() {
  const res = await api.get('/forums/categories');
  const categories = res?.data || [];

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Forums</h1>
      <div className="pm5k8w">
        {categories.map((category) => (
          <section key={category.id} className="xf6s1t">
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{category.name}</h2>
            {category.description && <p style={{ fontSize: '13px', color: 'var(--c-text-muted)', marginBottom: '12px' }}>{category.description}</p>}
            <div>
              {category.forums?.map((forum) => (
                <Link href={`/forums/${forum.slug}`} key={forum.id} className="zh0w5x" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{forum.icon || '📋'}</span>
                      <span className="mu6w1x">{forum.name}</span>
                    </div>
                    {forum.description && <p className="nv8y3z" style={{ marginTop: '4px' }}>{forum.description}</p>}
                    {forum.children?.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {forum.children.map((child) => (
                          <Link href={`/forums/${child.slug}`} key={child.id} className="px2c7d qy4e9f">{child.name}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ow0a5b" style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <strong style={{ display: 'block' }}>{forum.threadCount}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Threads</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong style={{ display: 'block' }}>{forum.commentCount}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Posts</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {categories.length === 0 && (
          <div className="xf6s1t uc4m9n">
            <p className="nv8y3z">No forums available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

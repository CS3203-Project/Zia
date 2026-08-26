import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { wishlistApi, type WishlistEntry } from '../../api/wishlistApi';
import PageHeader from '../../components/shared/PageHeader';

export default function SavedServicesPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    wishlistApi
      .list()
      .then((rows) => alive && setEntries(rows))
      .catch(() => alive && toast.error('Could not load your saved services'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const remove = async (serviceId: string) => {
    const before = entries;
    setEntries((rows) => rows.filter((r) => r.service.id !== serviceId));
    try {
      await wishlistApi.remove(serviceId);
    } catch {
      setEntries(before);
      toast.error('Could not remove that service');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 pt-20 pb-12 sm:px-6 lg:px-8">
        <PageHeader
          title="Saved Services"
          subtitle="Services you kept for later. Only you can see this list."
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <Bookmark className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <h3 className="mb-1 text-base font-semibold text-gray-900">Nothing saved yet</h3>
            <p className="mb-4 text-sm text-gray-500">
              Use “Save for later” on any service to keep it here.
            </p>
            <button
              onClick={() => navigate('/services')}
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700"
            >
              Browse services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(({ service, savedAt }) => (
              <div
                key={service.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => navigate(`/service/${service.id}`)}
                  className="block h-40 w-full overflow-hidden bg-gray-100 text-left"
                >
                  {service.images?.[0] ? (
                    <img
                      src={service.images[0]}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50" />
                  )}
                </button>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="mb-1 line-clamp-1 font-semibold text-gray-900">{service.title}</h3>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-500">{service.description}</p>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-semibold text-orange-600">
                      {service.currency} {Number(service.price).toLocaleString()}
                    </span>
                    <button
                      onClick={() => remove(service.id)}
                      title="Remove from saved"
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Saved {new Date(savedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

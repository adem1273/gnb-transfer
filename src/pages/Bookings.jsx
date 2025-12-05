import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function Bookings() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedBooking, setExpandedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/bookings');
      setBookings(response.data?.data || []);
    } catch (err) {
      setError(t('bookings.fetchError') || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpand = (bookingId) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  const filteredBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter(booking => booking.status === statusFilter);

  if (loading) {
    return <Loading message={t('bookings.loading') || 'Loading bookings...'} />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchBookings} />;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('bookings.title') || 'Bookings Management'}
        </h1>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            {t('bookings.filterByStatus') || 'Filter:'}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('bookings.allStatuses') || 'All Statuses'}</option>
            <option value="pending">{t('bookings.pending') || 'Pending'}</option>
            <option value="confirmed">{t('bookings.confirmed') || 'Confirmed'}</option>
            <option value="completed">{t('bookings.completed') || 'Completed'}</option>
            <option value="cancelled">{t('bookings.cancelled') || 'Cancelled'}</option>
            <option value="paid">{t('bookings.paid') || 'Paid'}</option>
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-gray-600">{t('bookings.noBookings') || 'No bookings found'}</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bookings.customer') || 'Customer'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bookings.tour') || 'Tour'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bookings.date') || 'Date'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bookings.guests') || 'Guests'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bookings.flightNumber') || 'Flight'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bookings.amount') || 'Amount'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bookings.status') || 'Status'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bookings.whatsapp') || 'WhatsApp'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <React.Fragment key={booking._id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(booking._id)}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.name}</div>
                        <div className="text-sm text-gray-500">{booking.email}</div>
                        <div className="text-xs text-gray-400">
                          {booking.phoneCountryCode || ''} {booking.phone || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.tour?.title || booking.tourId?.title || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{booking.date ? new Date(booking.date).toLocaleDateString() : '-'}</div>
                        {booking.time && <div className="text-xs text-gray-400">{booking.time}</div>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>👤 {booking.adultsCount || booking.guests || 1}</span>
                          {booking.childrenCount > 0 && <span className="text-xs">🧒 {booking.childrenCount}</span>}
                          {booking.infantsCount > 0 && <span className="text-xs">👶 {booking.infantsCount}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {booking.flightNumber || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ${booking.amount?.toFixed(2) || '0.00'}
                        {booking.extraServicesTotal > 0 && (
                          <div className="text-xs text-gray-500">
                            (incl. +${booking.extraServicesTotal?.toFixed(2)} extras)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {booking.whatsappLink ? (
                          <a
                            href={booking.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(booking._id); }}
                        >
                          {expandedBooking === booking._id ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row - Passenger Names (Ministry Requirement) */}
                    {expandedBooking === booking._id && (
                      <tr className="bg-gray-50">
                        <td colSpan="9" className="px-4 py-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Passenger Names */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {t('bookings.passengerNames') || 'Passenger Names'} 
                                <span className="text-xs text-amber-600 font-normal">(Ministry Requirement)</span>
                              </h4>
                              {booking.passengers && booking.passengers.length > 0 ? (
                                <ul className="space-y-1">
                                  {booking.passengers.map((p, i) => (
                                    <li key={i} className="text-sm flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center">
                                        {i + 1}
                                      </span>
                                      <span className="text-gray-400">{p.type === 'adult' ? '👤' : '🧒'}</span>
                                      <span className="font-medium">{p.firstName} {p.lastName}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No passenger names recorded</p>
                              )}
                            </div>
                            
                            {/* Extra Services */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {t('bookings.extraServices') || 'Extra Services'}
                              </h4>
                              {booking.extraServices ? (
                                <ul className="space-y-1 text-sm">
                                  {booking.extraServices.childSeat?.selected && (
                                    <li className="flex items-center gap-2">
                                      <span>🚼</span>
                                      <span>Child Seat x{booking.extraServices.childSeat.quantity}</span>
                                      <span className="text-green-600">(+${(booking.extraServices.childSeat.quantity * (booking.extraServices.childSeat.price || 10)).toFixed(2)})</span>
                                    </li>
                                  )}
                                  {booking.extraServices.babySeat?.selected && (
                                    <li className="flex items-center gap-2">
                                      <span>👶</span>
                                      <span>Baby Seat x{booking.extraServices.babySeat.quantity}</span>
                                      <span className="text-green-600">(+${(booking.extraServices.babySeat.quantity * (booking.extraServices.babySeat.price || 10)).toFixed(2)})</span>
                                    </li>
                                  )}
                                  {booking.extraServices.meetAndGreet?.selected && (
                                    <li className="flex items-center gap-2">
                                      <span>🎯</span>
                                      <span>Meet & Greet</span>
                                      <span className="text-green-600">(+${(booking.extraServices.meetAndGreet.price || 15).toFixed(2)})</span>
                                    </li>
                                  )}
                                  {booking.extraServices.vipLounge?.selected && (
                                    <li className="flex items-center gap-2">
                                      <span>✨</span>
                                      <span>VIP Lounge</span>
                                      <span className="text-green-600">(+${(booking.extraServices.vipLounge.price || 50).toFixed(2)})</span>
                                    </li>
                                  )}
                                  {!booking.extraServices.childSeat?.selected && 
                                   !booking.extraServices.babySeat?.selected && 
                                   !booking.extraServices.meetAndGreet?.selected && 
                                   !booking.extraServices.vipLounge?.selected && (
                                    <li className="text-gray-500 italic">No extra services</li>
                                  )}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No extra services</p>
                              )}
                            </div>

                            {/* Pickup Location & Notes */}
                            <div className="md:col-span-2">
                              {booking.pickupLocation && (
                                <div className="mb-2">
                                  <span className="text-sm font-medium text-gray-600">Pickup: </span>
                                  <span className="text-sm">{booking.pickupLocation}</span>
                                </div>
                              )}
                              {booking.notes && (
                                <div>
                                  <span className="text-sm font-medium text-gray-600">Notes: </span>
                                  <span className="text-sm text-gray-700">{booking.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookings;

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import API from '../utils/api';

function CalendarView() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await API.get('/bookings/calendar');
      setBookings(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
      setLoading(false);
    }
  };

  const getBookingsForDate = (date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return bookings.filter((booking) => {
      const bookingDate = dayjs(booking.start).format('YYYY-MM-DD');
      return bookingDate === dateStr;
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dayBookings = getBookingsForDate(date);
    setSelectedBookings(dayBookings);
    if (dayBookings.length > 0) {
      setShowModal(true);
    }
  };

  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dayBookings = getBookingsForDate(date);
      if (dayBookings.length > 0) {
        const hasConfirmed = dayBookings.some((b) => b.status === 'confirmed');
        const hasPending = dayBookings.some((b) => b.status === 'pending');
        const hasCancelled = dayBookings.some((b) => b.status === 'cancelled');

        if (hasConfirmed) return 'booking-confirmed';
        if (hasPending) return 'booking-pending';
        if (hasCancelled) return 'booking-cancelled';
      }
    }
    return null;
  };

  const getTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayBookings = getBookingsForDate(date);
      if (dayBookings.length > 0) {
        return (
          <div className="text-xs mt-1 font-semibold">
            {dayBookings.length}
          </div>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Helmet>
        <title>Calendar View | GNB Transfer Admin</title>
      </Helmet>

      <h2 className="text-3xl font-bold mb-6">Booking Calendar</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <Calendar
            onChange={handleDateClick}
            value={selectedDate}
            tileClassName={getTileClassName}
            tileContent={getTileContent}
            className="w-full"
          />
          <style jsx>{`
            .booking-confirmed {
              background-color: #d1fae5 !important;
            }
            .booking-pending {
              background-color: #fef3c7 !important;
            }
            .booking-cancelled {
              background-color: #fee2e2 !important;
            }
          `}</style>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Legend</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-200 rounded mr-3"></div>
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-200 rounded mr-3"></div>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-200 rounded mr-3"></div>
              <span className="text-sm">Cancelled</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-xl font-semibold mb-4">Statistics</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Total Bookings:</span> {bookings.length}
              </p>
              <p className="text-sm">
                <span className="font-medium">Confirmed:</span>{' '}
                {bookings.filter((b) => b.status === 'confirmed').length}
              </p>
              <p className="text-sm">
                <span className="font-medium">Pending:</span>{' '}
                {bookings.filter((b) => b.status === 'pending').length}
              </p>
              <p className="text-sm">
                <span className="font-medium">Cancelled:</span>{' '}
                {bookings.filter((b) => b.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Bookings for {dayjs(selectedDate).format('MMMM D, YYYY')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedBookings.length === 0 ? (
                <p className="text-center text-gray-500">No bookings for this date</p>
              ) : (
                selectedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border rounded p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{booking.title}</h4>
                      <span
                        className={`px-3 py-1 rounded text-sm ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Email:</strong> {booking.email}
                      </p>
                      <p>
                        <strong>Guests:</strong> {booking.guests}
                      </p>
                      <p>
                        <strong>Total Price:</strong> ${booking.totalPrice}
                      </p>
                      <p>
                        <strong>Time:</strong> {dayjs(booking.start).format('h:mm A')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;

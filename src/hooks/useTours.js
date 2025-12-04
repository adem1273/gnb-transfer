import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export const useTours = (params = {}) =>
  useQuery({
    queryKey: ['tours', params],
    queryFn: () => api.get('/tours', { params }).then((res) => res.data),
  });

export const useTour = (id) =>
  useQuery({
    queryKey: ['tour', id],
    queryFn: () => api.get(`/tours/${id}`).then((res) => res.data),
    enabled: !!id,
  });

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingData) => api.post('/bookings', bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

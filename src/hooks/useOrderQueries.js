import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { checkout, getOrders, getOrder, cancelOrder } from "../api/orders"
import { getReceipt } from "../api/payments"
import { getMyRefunds, requestRefund } from "../api/refunds"
import { queryKeys } from "../api/queryKeys"

// Cache policies (staleTime / gcTime): orders & refunds -> 1 min / 10 min
// receipts (immutable payment data) -> 5 min / 30 min

export function useOrders({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.orders.lists(),
    queryFn: getOrders,
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  })
}

export function useOrder(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => getOrder(id),
    enabled: enabled && Boolean(id),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  })
}

export function useMyRefunds({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.refunds.mine(),
    queryFn: getMyRefunds,
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  })
}

export function useReceipt(paymentId, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.payments.receipt(paymentId),
    queryFn: () => getReceipt(paymentId),
    enabled: enabled && Boolean(paymentId),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
  })
}

export function useCheckoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderAddress, paymentMethod }) =>
      checkout(orderAddress, paymentMethod),
    onSuccess: () => {
      // The cart itself is cleared explicitly by the checkout flow
      // (COD) or by the Stripe webhook (card payments).
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId) => cancelOrder(orderId),
    onSuccess: (data, orderId) => {
      // The cancel response is the updated order — write it straight into
      // the detail cache, then refresh only the order list.
      queryClient.setQueryData(queryKeys.orders.detail(orderId), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() })
    },
  })
}

export function useRequestRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }) => requestRefund(orderId, reason),
    onSuccess: () => {
      // A refund changes the refund list and the order's refund/payment state
      queryClient.invalidateQueries({ queryKey: queryKeys.refunds.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}

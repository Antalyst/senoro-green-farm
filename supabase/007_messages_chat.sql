  -- 007_messages_chat.sql
  -- Buyer ↔ delivery rider chat tied to active orders (Supabase Realtime)

  CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    message_text text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
    CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
  );

  -- Crucial for enabling immediate real-time synchronization updates via Supabase
  ALTER TABLE public.messages REPLICA IDENTITY FULL;

  CREATE INDEX idx_messages_order_id ON public.messages (order_id);
  CREATE INDEX idx_messages_order_created_at ON public.messages (order_id, created_at);

  ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

  -- Participants on the order (buyer or assigned rider) can read the thread
  CREATE POLICY "Order participants can read messages"
  ON public.messages FOR SELECT
  USING (
    auth.uid() IN (sender_id, receiver_id)
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = messages.order_id
        AND (o.buyer_id = auth.uid() OR o.delivery_rider_id = auth.uid())
    )
  );

  -- Buyer and rider may send messages only to each other on active delivery orders
  CREATE POLICY "Order participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_id
        AND o.delivery_rider_id IS NOT NULL
        AND o.status IN ('ready_for_pickup', 'out_for_delivery')
        AND (
          (o.buyer_id = sender_id AND o.delivery_rider_id = receiver_id)
          OR (o.delivery_rider_id = sender_id AND o.buyer_id = receiver_id)
        )
        AND (o.buyer_id = auth.uid() OR o.delivery_rider_id = auth.uid())
    )
  );

  -- Add to Realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

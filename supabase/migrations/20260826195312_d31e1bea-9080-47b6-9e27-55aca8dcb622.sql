DROP POLICY "bids_owner_write" ON public.bids;
DROP POLICY "bids_owner_update" ON public.bids;
DROP POLICY "videos_owner_read" ON public.videos;
DROP POLICY "videos_owner_insert" ON public.videos;
DROP POLICY "videos_owner_update" ON public.videos;
DROP POLICY "slots_owner_insert" ON public.billboard_slots;
DROP POLICY "slots_owner_update" ON public.billboard_slots;
DROP FUNCTION public.is_my_realtor(uuid);

CREATE POLICY "bids_owner_insert" ON public.bids FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email'));
CREATE POLICY "bids_owner_update" ON public.bids FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email')) WITH CHECK (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email'));

CREATE POLICY "videos_owner_read" ON public.videos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email'));
CREATE POLICY "videos_owner_insert" ON public.videos FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email'));
CREATE POLICY "videos_owner_update" ON public.videos FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email')) WITH CHECK (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email'));

CREATE POLICY "slots_owner_insert" ON public.billboard_slots FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email'));
CREATE POLICY "slots_owner_update" ON public.billboard_slots FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email')) WITH CHECK (EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = realtor_id AND r.email = auth.jwt() ->> 'email'));

CREATE POLICY "mentor-media read auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mentor-media');
CREATE POLICY "mentor-media admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mentor-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "mentor-media admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'mentor-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "mentor-media admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'mentor-media' AND public.has_role(auth.uid(),'admin'));

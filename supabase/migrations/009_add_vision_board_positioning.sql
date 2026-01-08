-- Add positioning fields to vision_board_images for collage-style layout
ALTER TABLE public.vision_board_images
  ADD COLUMN IF NOT EXISTS position_x NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS position_y NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rotation NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS width NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS height NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS element_type TEXT DEFAULT 'image' CHECK (element_type IN ('image', 'text', 'decoration'));

-- Add index for z_index to help with rendering order
CREATE INDEX IF NOT EXISTS vision_board_images_z_index_idx ON public.vision_board_images(version_id, z_index);

COMMENT ON COLUMN public.vision_board_images.position_x IS 'X position in pixels (0-100 for percentage, or absolute pixel value)';
COMMENT ON COLUMN public.vision_board_images.position_y IS 'Y position in pixels (0-100 for percentage, or absolute pixel value)';
COMMENT ON COLUMN public.vision_board_images.rotation IS 'Rotation angle in degrees';
COMMENT ON COLUMN public.vision_board_images.width IS 'Width in pixels or percentage';
COMMENT ON COLUMN public.vision_board_images.height IS 'Height in pixels or percentage';
COMMENT ON COLUMN public.vision_board_images.z_index IS 'Z-index for layering (higher values appear on top)';
COMMENT ON COLUMN public.vision_board_images.element_type IS 'Type of element: image, text, or decoration';

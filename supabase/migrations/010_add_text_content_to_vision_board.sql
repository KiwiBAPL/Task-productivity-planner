-- Add text_content field to vision_board_images for text elements
ALTER TABLE public.vision_board_images
  ADD COLUMN IF NOT EXISTS text_content TEXT DEFAULT NULL;

COMMENT ON COLUMN public.vision_board_images.text_content IS 'HTML content for text elements. Only used when element_type is "text".';

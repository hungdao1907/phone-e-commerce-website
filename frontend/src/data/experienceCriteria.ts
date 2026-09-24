export interface ExperienceCriterion {
  id: string;
  label: string;
}

export const CATEGORY_EXPERIENCE_CRITERIA: Record<string, ExperienceCriterion[]> = {
  iphone: [
    { id: 'performance', label: 'Hiệu năng' },
    { id: 'camera', label: 'Camera' },
    { id: 'battery', label: 'Thời lượng pin' },
    { id: 'display', label: 'Màn hình' },
    { id: 'design', label: 'Thiết kế' },
  ],
  samsung: [
    { id: 'performance', label: 'Hiệu năng' },
    { id: 'camera', label: 'Camera' },
    { id: 'battery', label: 'Thời lượng pin' },
    { id: 'display', label: 'Màn hình' },
    { id: 'design', label: 'Thiết kế' },
  ],
  xiaomi: [
    { id: 'performance', label: 'Hiệu năng' },
    { id: 'camera', label: 'Camera' },
    { id: 'battery', label: 'Thời lượng pin' },
    { id: 'display', label: 'Màn hình' },
    { id: 'design', label: 'Thiết kế' },
  ],
  oppo: [
    { id: 'performance', label: 'Hiệu năng' },
    { id: 'camera', label: 'Camera' },
    { id: 'battery', label: 'Thời lượng pin' },
    { id: 'display', label: 'Màn hình' },
    { id: 'design', label: 'Thiết kế' },
  ],
  laptop: [
    { id: 'performance', label: 'Hiệu năng' },
    { id: 'display', label: 'Màn hình' },
    { id: 'keyboard', label: 'Bàn phím' },
    { id: 'touchpad', label: 'Touchpad' },
    { id: 'battery', label: 'Thời lượng pin' },
    { id: 'cooling', label: 'Tản nhiệt' },
    { id: 'design', label: 'Thiết kế' },
  ],
  ipad: [
    { id: 'display', label: 'Màn hình' },
    { id: 'performance', label: 'Hiệu năng' },
    { id: 'battery', label: 'Thời lượng pin' },
    { id: 'speaker', label: 'Loa' },
    { id: 'design', label: 'Thiết kế' },
    { id: 'writing', label: 'Trải nghiệm viết/vẽ' },
  ],
  watch: [
    { id: 'performance', label: 'Hiệu năng' },
    { id: 'battery', label: 'Thời lượng pin' },
    { id: 'design', label: 'Thiết kế' },
    { id: 'health', label: 'Cảm biến sức khỏe' },
    { id: 'comfort', label: 'Độ thoải mái' },
  ],
  audio: [
    { id: 'sound', label: 'Chất lượng âm thanh' },
    { id: 'bass', label: 'Bass' },
    { id: 'anc', label: 'Chống ồn' },
    { id: 'battery', label: 'Thời lượng pin' },
    { id: 'comfort', label: 'Độ thoải mái' },
    { id: 'mic', label: 'Microphone' },
  ]
};

export const DEFAULT_EXPERIENCE_CRITERIA: ExperienceCriterion[] = [
  { id: 'quality', label: 'Chất lượng sản phẩm' },
  { id: 'design', label: 'Thiết kế' },
  { id: 'value', label: 'Đáng giá tiền' },
];

export function getCriteriaForCategory(categorySlug: string): ExperienceCriterion[] {
  if (!categorySlug) return DEFAULT_EXPERIENCE_CRITERIA;
  
  // Try to find exact match
  if (CATEGORY_EXPERIENCE_CRITERIA[categorySlug]) {
    return CATEGORY_EXPERIENCE_CRITERIA[categorySlug];
  }

  // Try to find partial match (e.g. categorySlug = "dien-thoai-iphone", "tai-nghe")
  const slug = categorySlug.toLowerCase();
  
  if (slug.includes('phone') || slug.includes('thoai')) return CATEGORY_EXPERIENCE_CRITERIA.iphone;
  if (slug.includes('laptop') || slug.includes('macbook')) return CATEGORY_EXPERIENCE_CRITERIA.laptop;
  if (slug.includes('pad') || slug.includes('tablet') || slug.includes('bang')) return CATEGORY_EXPERIENCE_CRITERIA.ipad;
  if (slug.includes('watch') || slug.includes('dong-ho')) return CATEGORY_EXPERIENCE_CRITERIA.watch;
  if (slug.includes('audio') || slug.includes('tai-nghe') || slug.includes('loa') || slug.includes('airpods')) return CATEGORY_EXPERIENCE_CRITERIA.audio;

  return DEFAULT_EXPERIENCE_CRITERIA;
}

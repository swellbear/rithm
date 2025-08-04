// Optimized icon exports - use lucide-react primarily (already optimized)
// Fallback to react-icons only when needed, with specific imports

// Since lucide-react is already well-optimized in this project, we'll use it primarily
// Only import specific react-icons when absolutely needed

// Common icons that may not be in lucide-react
export const MaterialIcons = {
  // Dynamically import only when needed to avoid bundle bloat
  async upload() {
    const { MdUpload } = await import('react-icons/md');
    return MdUpload;
  },
  async download() {
    const { MdDownload } = await import('react-icons/md');
    return MdDownload;
  },
  async tensorflow() {
    const { SiTensorflow } = await import('react-icons/si');
    return SiTensorflow;
  },
  async huggingface() {
    const { SiHuggingface } = await import('react-icons/si');
    return SiHuggingface;
  },
  async robot() {
    const { BsRobot } = await import('react-icons/bs');
    return BsRobot;
  }
};

// Prefer lucide-react for most icons (already imported correctly in components)
// Use dynamic imports for specific react-icons only when needed

// Helper function to get icon by name with lazy loading
export const getIcon = async (name: string) => {
  // Most icons should use lucide-react which is already optimized
  // Only use react-icons for specific brand/unique icons
  switch (name) {
    case 'tensorflow':
      return await MaterialIcons.tensorflow();
    case 'huggingface':
      return await MaterialIcons.huggingface();
    case 'robot':
      return await MaterialIcons.robot();
    default:
      // Default to lucide-react icons (import them in components as needed)
      return null;
  }
};

// Export MaterialIcons for direct use
export default MaterialIcons;
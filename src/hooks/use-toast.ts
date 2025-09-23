import { toast as sonnerToast } from "sonner";

// Legacy compatibility function for existing shadcn/ui toast code
export function useToast() {
  return {
    toast: (props: { 
      title?: string; 
      description?: string; 
      variant?: string;
      duration?: number;
      [key: string]: any; // Allow any other properties
    }) => {
      const message = props.title || props.description || "";
      const options = props.duration ? { duration: props.duration } : {};
      
      if (props.variant === "destructive") {
        sonnerToast.error(message, options);
      } else {
        sonnerToast.success(message, options);
      }
    },
    dismiss: sonnerToast.dismiss
  };
}

// Export toast function for direct usage (like `toast({ title: "Success" })`)
export function toast(message: string | { title?: string; description?: string; variant?: string; duration?: number }) {
  if (typeof message === 'string') {
    sonnerToast.success(message);
  } else {
    const text = message.title || message.description || "";
    const options = message.duration ? { duration: message.duration } : {};
    
    if (message.variant === "destructive") {
      sonnerToast.error(text, options);
    } else {
      sonnerToast.success(text, options);
    }
  }
}
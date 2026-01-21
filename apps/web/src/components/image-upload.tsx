import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
  endpoint?: string;
}

export function ImageUpload({ value, onChange, className, endpoint = "http://localhost:3000/api/uploads" }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      toast.error("格式不支持。请上传 JPEG、PNG、WebP 或 GIF 格式。");
      return;
    }

    // Validate file size (e.g., 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件过大。最大支持 10MB。");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("上传失败");
      }

      const data = await response.json();
      onChange(data.url);
      toast.success("图片上传成功！");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("图片上传失败。");
    } finally {
      setLoading(false);
      // Reset input so selecting the same file triggers change again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={clearImage}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          {/* Allow clicking the image itself to re-upload if needed? Or just rely on separate button? 
              Let's keep it simple: clear to remove, or click container to change? 
              Common pattern: hover to see 'change' or 'remove'.
          */}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center 
            cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors
            ${loading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">上传</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

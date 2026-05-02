import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type Props = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export function Button({
  title,
  variant = "primary",
  loading,
  disabled,
  className,
  ...rest
}: Props) {
  const base =
    "rounded-xl px-4 py-3 items-center justify-center min-h-[48px] active:opacity-80";
  const variants = {
    primary: "bg-slate-900",
    secondary: "bg-slate-200",
    ghost: "bg-transparent border border-slate-300",
  };
  const textColors = {
    primary: "text-white font-semibold",
    secondary: "text-slate-900 font-semibold",
    ghost: "text-slate-900 font-medium",
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled ?? loading}
      className={`${base} ${variants[variant]} ${disabled || loading ? "opacity-50" : ""} ${className ?? ""}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#0f172a"} />
      ) : (
        <Text className={textColors[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}

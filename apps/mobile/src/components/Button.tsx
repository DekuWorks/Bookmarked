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
    "rounded-xl px-4 py-3 items-center justify-center min-h-[48px] active:scale-[0.98]";
  const variants = {
    primary: "bg-puce-red",
    secondary: "bg-primary",
    ghost: "bg-transparent border border-brand-border",
  };
  const textColors = {
    primary: "text-white font-semibold",
    secondary: "text-puce-red font-semibold",
    ghost: "text-puce-red font-medium",
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled ?? loading}
      className={`${base} ${variants[variant]} ${disabled || loading ? "opacity-50" : ""} ${className ?? ""}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#642F37"} />
      ) : (
        <Text className={textColors[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}

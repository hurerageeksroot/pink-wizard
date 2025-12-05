import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				'xs': '475px',
			},
			fontFamily: {
				'playfair': ['Playfair Display', 'serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				cold: 'hsl(var(--cold-lead))',
				warm: 'hsl(var(--warm-lead))',
				hot: 'hsl(var(--hot-lead))',
				won: 'hsl(var(--won-lead))',
				'lost-maybe': 'hsl(var(--lost-maybe-lead))',
				'lost-not-fit': 'hsl(var(--lost-not-fit-lead))',
				'brand-pink': 'hsl(var(--brand-pink))',
				'brand-coral': 'hsl(var(--brand-coral))',
				'brand-teal-dark': 'hsl(var(--brand-teal-dark))',
				'brand-magenta': 'hsl(var(--brand-magenta))',
				'brand-teal-darker': 'hsl(var(--brand-teal-darker))',
				'brand-teal-darkest': 'hsl(var(--brand-teal-darkest))',
				'brand-lime': 'hsl(var(--brand-lime))',
				'email-primary': 'hsl(var(--email-primary))',
				'email-secondary': 'hsl(var(--email-secondary))',
				'email-accent': 'hsl(var(--email-accent))',
				'email-background': 'hsl(var(--email-background))',
				'email-text': 'hsl(var(--email-text))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				hover: {
					subtle: 'hsl(var(--hover-subtle))',
					accent: 'hsl(var(--hover-accent))',
					primary: 'hsl(var(--hover-primary))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-cold': 'var(--gradient-cold)',
				'gradient-warm': 'var(--gradient-warm)',
				'gradient-hot': 'var(--gradient-hot)',
				'gradient-won': 'var(--gradient-won)',
				'gradient-lost-maybe': 'var(--gradient-lost-maybe)',
				'gradient-lost-not-fit': 'var(--gradient-lost-not-fit)',
				'gradient-email-header': 'var(--gradient-email-header)',
				'gradient-email-button': 'var(--gradient-email-button)',
				'gradient-email-accent': 'var(--gradient-email-accent)',
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'card': 'var(--shadow-card)',
				'elevated': 'var(--shadow-elevated)',
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'bounce': 'var(--transition-bounce)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'pulse-slow': 'pulse-slow 3s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

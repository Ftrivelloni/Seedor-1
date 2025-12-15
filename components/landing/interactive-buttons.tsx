"use client"

import { Button } from "../ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function PrimaryButton({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href}>
            <Button 
                size="lg" 
                className="cursor-pointer px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105" 
                style={{ backgroundColor: '#63bd0a', color: 'white', fontFamily: 'Circular Std, sans-serif' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8bc34a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#63bd0a'}
            >
                {children}
            </Button>
        </Link>
    )
}

export function OutlineButton({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href}>
            <Button 
                size="lg" 
                variant="outline" 
                className="cursor-pointer px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 border-2" 
                style={{ borderColor: '#f87163', color: '#f87163', fontFamily: 'Circular Std, sans-serif' }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f87163'
                    e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#f87163'
                }}
            >
                {children}
            </Button>
        </Link>
    )
}

export function CTAPrimaryButton({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href}>
            <Button 
                size="lg" 
                className="cursor-pointer px-8 py-3 text-lg font-black rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105" 
                style={{ backgroundColor: '#63bd0a', color: 'white', fontFamily: 'Circular Std, sans-serif' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8bc34a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#63bd0a'}
            >
                {children}
            </Button>
        </Link>
    )
}

export function CTAOutlineButton({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href}>
            <Button 
                size="lg" 
                variant="outline" 
                className="cursor-pointer border-2 px-8 py-3 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105" 
                style={{ borderColor: '#f87163', color: '#f87163', fontFamily: 'Circular Std, sans-serif' }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f87163'
                    e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#f87163'
                }}
            >
                {children}
            </Button>
        </Link>
    )
}

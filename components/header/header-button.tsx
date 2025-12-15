"use client"

import { Button } from "../ui/button"
import Link from "next/link"

export function HeaderButton({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href}>
            <Button 
                className="ml-2 px-6 py-2.5 text-base font-bold rounded-lg cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                style={{ 
                    backgroundColor: '#63bd0a', 
                    color: 'white',
                    fontFamily: 'Circular Std, sans-serif',
                    border: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8bc34a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#63bd0a'}
            >
                {children}
            </Button>
        </Link>
    )
}

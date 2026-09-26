import { createContext } from 'react'

/**
 * True while a screen is rendered inside Prototype's variant="figure" — a frozen illustration
 * on the case page, not the live product. Screens read this to stay honest about what they are:
 * no role="alert" (nothing is actually happening), no heading-level titles (the phone contents
 * aren't a heading in the page outline).
 */
export const FigureContext = createContext(false)

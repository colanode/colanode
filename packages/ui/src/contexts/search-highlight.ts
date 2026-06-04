import { createContext, useContext } from 'react';

interface SearchHighlightContext {
    terms: string[];
}

export const SearchHighlightContext = createContext<SearchHighlightContext>({
    terms: [],
});

export const useSearchHighlight = () => useContext(SearchHighlightContext);

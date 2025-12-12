"use client";

import { useState } from "react";

interface DescriptionTextProps {
    text: string;
}

export default function DescriptionText({ text }: DescriptionTextProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxLength = 300;

    if (!text) return null;

    const isHtml = /<[a-z][\s\S]*>/i.test(text);
    const shouldTruncate = text.length > maxLength;

    return (
        <div className="bg-gray-50 py-8 border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4">
                <div className="prose prose-gray max-w-none text-center relative">
                    <div
                        className={`text-gray-700 leading-relaxed text-base md:text-lg overflow-hidden transition-all duration-500 ease-in-out ${shouldTruncate && !isExpanded ? "max-h-32" : "max-h-full"
                            }`}
                    >
                        {isHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: text }} />
                        ) : (
                            <p>{text}</p>
                        )}
                    </div>

                    {shouldTruncate && !isExpanded && (
                        <div className="absolute bottom-12 left-0 w-full h-16 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
                    )}

                    {shouldTruncate && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mt-4 inline-flex items-center text-sm font-bold text-[#C83232] hover:text-[#a02828] transition-colors z-10 relative uppercase tracking-wider"
                        >
                            {isExpanded ? "Read Less" : "Read More"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

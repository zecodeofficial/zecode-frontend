"use client";

import { useState } from "react";

interface DescriptionTextProps {
    text: string;
}

export default function DescriptionText({ text }: DescriptionTextProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxLength = 300;

    if (!text) return null;

    const shouldTruncate = text.length > maxLength;
    const displayText = isExpanded ? text : text.slice(0, maxLength);

    return (
        <div className="bg-gray-50 py-8 border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4">
                <div className="prose prose-gray max-w-none text-center">
                    <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                        {displayText}
                        {shouldTruncate && !isExpanded && "..."}
                    </p>

                    {shouldTruncate && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            {isExpanded ? "Read Less" : "Read More"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

<?php

declare(strict_types=1);

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

$finder = Finder::create()
    ->in([
        __DIR__ . '/app',
        __DIR__ . '/config',
        __DIR__ . '/database',
        __DIR__ . '/routes',
        __DIR__ . '/tests',
    ])
    ->ignoreDotFiles(true)
    ->ignoreVCS(true);

return (new Config())
    ->setRiskyAllowed(false)
    ->setRules([
        // 基本（インデント / 空白 / PSR-12）
        '@PSR12' => true,
        'method_chaining_indentation' => true,
        // 余計な空白・改行の整理
        'no_trailing_whitespace' => true,
        'no_trailing_whitespace_in_comment' => true,
        'single_blank_line_at_eof' => true,
        'no_extra_blank_lines' => [
            'tokens' => [
                'extra',
                'throw',
                'use',
                'use_trait',
                'return',
                'break',
                'continue',
                'parenthesis_brace_block',
                'square_brace_block',
                'curly_brace_block',
            ],
        ],

        // 配列の空白（地味に効く）
        'trim_array_spaces' => true,

        // use の並び替え（差分が減るので最低限おすすめ）
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
    ])
    ->setFinder($finder);

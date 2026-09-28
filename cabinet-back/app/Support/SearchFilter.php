<?php

namespace App\Support;

use Spatie\QueryBuilder\AllowedFilter;

class SearchFilter
{
    /**
     * Filtre de recherche multi-colonnes (compatible pgsql et sqlite).
     *
     * @param  array<int, string>  $columns
     */
    public static function partial(array $columns): AllowedFilter
    {
        return AllowedFilter::callback('search', function ($query, $value) use ($columns): void {
            $term = '%'.mb_strtolower((string) $value).'%';

            $query->where(function ($q) use ($columns, $term): void {
                foreach ($columns as $column) {
                    $q->orWhereRaw("LOWER({$column}) LIKE ?", [$term]);
                }
            });
        });
    }
}

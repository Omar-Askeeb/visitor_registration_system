<?php

namespace App\Http\Controllers;

use App\Models\Country;
use Illuminate\Http\JsonResponse;

class CountryController extends Controller
{
    /**
     * Get list of countries sorted with Libya at the top.
     */
    public function index(): JsonResponse
    {
        $countries = Country::orderByRaw("CASE WHEN arabic_name = 'ليبيا' THEN 0 ELSE 1 END")
            ->orderBy('arabic_name', 'asc')
            ->get();

        return response()->json($countries);
    }
}

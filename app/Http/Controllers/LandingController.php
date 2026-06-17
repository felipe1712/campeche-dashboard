<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Indicator;

class LandingController extends Controller
{
    public function index(Request $request)
    {
        $año = $request->input('año', 2025);
        $mision = $request->input('mision', '1');

        $estrellas = Indicator::with('tema')->where('is_estrella', true)
                          ->where('año', $año)
                          ->where('mision', $mision)
                          ->get();

        return Inertia::render('Landing/Index', [
            'indicators' => $estrellas,
            'filters' => [
                'año' => (int) $año,
                'mision' => $mision
            ]
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Indicator;
use App\Models\Tema;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $query = Indicator::query()->with('tema');

        // Defaults
        $año = $request->input('año', 2025);
        $mision = $request->input('mision', '1');
        $tema_id = $request->input('tema_id');
        $subtema_id = $request->input('subtema_id');
        $dependencia = $request->input('dependencia');

        $query->where('año', $año)
              ->where('mision', $mision);

        if ($tema_id) {
            $query->where('tema_id', $tema_id);
        }
        if ($subtema_id) {
            $query->where('subtema_id', $subtema_id);
        }
        if ($dependencia) {
            $query->where('dependencia', $dependencia);
        }

        $indicators = $query->paginate(20)->withQueryString();

        $temas = Tema::orderBy('nombre')->get();
        
        $subtemas = [];
        if ($tema_id) {
            $subtemas = \App\Models\Subtema::where('tema_id', $tema_id)->get();
        }

        $dependencias = Indicator::select('dependencia')
            ->whereNotNull('dependencia')
            ->where('dependencia', '!=', '')
            ->distinct()
            ->orderBy('dependencia')
            ->pluck('dependencia');

        return Inertia::render('Dashboard/Index', [
            'indicators' => $indicators,
            'temas' => $temas,
            'subtemas' => $subtemas,
            'dependencias' => $dependencias,
            'filters' => [
                'año' => $año,
                'mision' => $mision,
                'tema_id' => $tema_id,
                'subtema_id' => $subtema_id,
                'dependencia' => $dependencia,
            ]
        ]);
    }
}

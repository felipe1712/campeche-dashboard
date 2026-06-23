<?php

namespace App\Http\Controllers;

use App\Models\Indicator;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IndicatorAdminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Get all strategic indicators ordered by mision and clave
        $indicators = Indicator::where('is_estrella', 1)
            ->orderBy('mision')
            ->orderBy('clave')
            ->get();

        // Group by mision
        $grouped = $indicators->groupBy(function ($item) {
            return $item->mision ?: 'Sin Misión';
        });

        return Inertia::render('Admin/IndicatorsAdmin', [
            'groupedIndicators' => $grouped
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'tipo_grafica' => 'required|string|in:bar,bar-horizontal,pie,donut',
        ]);

        $indicator = Indicator::findOrFail($id);
        $indicator->titulo = $request->titulo;
        $indicator->tipo_grafica = $request->tipo_grafica;
        $indicator->save();

        return redirect()->back()->with('success', 'Indicador actualizado exitosamente');
    }
}

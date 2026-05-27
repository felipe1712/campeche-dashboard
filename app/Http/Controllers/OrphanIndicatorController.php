<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Indicator;
use App\Models\Tema;
use App\Models\Subtema;

class OrphanIndicatorController extends Controller
{
    public function index()
    {
        // Traer indicadores "huérfanos" (Sin Tema o Dependencia no especificada)
        $orphans = Indicator::with('tema')
            ->whereNull('tema_id')
            ->orWhere('dependencia', 'No Especificada')
            ->orWhere('dependencia', '')
            ->orderBy('año', 'desc')
            ->orderBy('clave', 'asc')
            ->paginate(20);

        // Listados de Temas y Dependencias (para los selectores)
        $temas = Tema::orderBy('año', 'desc')->orderBy('nombre', 'asc')->get();
        $dependencias = Indicator::select('dependencia')
            ->whereNotNull('dependencia')
            ->where('dependencia', '!=', 'No Especificada')
            ->where('dependencia', '!=', '')
            ->distinct()
            ->orderBy('dependencia')
            ->pluck('dependencia');

        // Subtemas (opcional, si queremos mapearlos)
        $subtemas = Subtema::all();

        return Inertia::render('Orphans/Index', [
            'orphans' => $orphans,
            'temas' => $temas,
            'subtemas' => $subtemas,
            'dependencias' => $dependencias
        ]);
    }

    public function update(Request $request, $id)
    {
        $indicator = Indicator::findOrFail($id);
        
        $request->validate([
            'tema_id' => 'nullable|integer|exists:temas,id',
            'subtema_id' => 'nullable|integer|exists:subtemas,id',
            'dependencia' => 'required|string',
            'titulo' => 'required|string',
        ]);

        $indicator->update([
            'tema_id' => $request->tema_id,
            'subtema_id' => $request->subtema_id,
            'dependencia' => $request->dependencia,
            'titulo' => $request->titulo,
        ]);

        return redirect()->back()->with('success', 'Indicador actualizado correctamente.');
    }
}

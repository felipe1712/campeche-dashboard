<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MissionController extends Controller
{
    public function index()
    {
        $missions = Mission::orderBy('numero')->get();
        return Inertia::render('Admin/MissionsAdmin', [
            'missionsData' => $missions
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'missions' => 'required|array',
            'missions.*.id' => 'required|integer|exists:missions,id',
            'missions.*.nombre' => 'required|string|max:255',
        ]);

        foreach ($request->missions as $missionData) {
            $mission = Mission::find($missionData['id']);
            if ($mission) {
                $mission->nombre = $missionData['nombre'];
                $mission->save();
            }
        }

        \Illuminate\Support\Facades\Cache::forget('global_missions');

        return redirect()->back()->with('success', 'Nombres de misiones actualizados correctamente.');
    }
}

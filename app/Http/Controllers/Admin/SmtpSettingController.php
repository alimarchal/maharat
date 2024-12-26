<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SmtpSetting\StoreSmtpSettingRequest;
use App\Http\Requests\SmtpSetting\UpdateSmtpSettingRequest;
use App\Models\SmtpSetting;

class SmtpSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSmtpSettingRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(SmtpSetting $smtpSetting)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SmtpSetting $smtpSetting)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSmtpSettingRequest $request, SmtpSetting $smtpSetting)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SmtpSetting $smtpSetting)
    {
        //
    }
}

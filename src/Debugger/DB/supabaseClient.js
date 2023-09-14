const { createClient } = require("@supabase/supabase-js")

const supabase = createClient('https://xvcxeimpfczurqosovfp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2Y3hlaW1wZmN6dXJxb3NvdmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkyNDIxNjksImV4cCI6MjAwNDgxODE2OX0.TE3VMkCDXaoFP3k81BA-sEaIpVKTy0rnTlbp5k5mOdU')

module.exports = {supabase}
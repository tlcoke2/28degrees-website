import React, { useEffect, useState } from 'react';
import {
  Box, Tabs, Tab, TextField, Grid, Button, Paper, Typography,
  Snackbar, Alert, CircularProgress
} from '@mui/material';
import { contentService, type HomeContent, type AboutContent } from '../../services/contentService';

type TabKey = 'home' | 'about';

const ContentEditor: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [home, setHome] = useState<HomeContent>({});
  const [about, setAbout] = useState<AboutContent>({});
  const [snack, setSnack] = useState<{open: boolean; msg: string; sev: 'success'|'error'|'info'|'warning'}>({
    open: false, msg: '', sev: 'success'
  });

  const show = (msg: string, sev: typeof snack.sev = 'success') => setSnack({ open: true, msg, sev });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [homeRes, aboutRes] = await Promise.all([
          contentService.getAdmin<HomeContent>('home'),
          contentService.getAdmin<AboutContent>('about'),
        ]);
        setHome(homeRes?.data || {});
        setAbout(aboutRes?.data || {});
      } catch (e:any) {
        show(e?.message || 'Failed to load content', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      if (tab === 'home') await contentService.save('home', home);
      else await contentService.save('about', about);
      show('Content saved');
    } catch (e:any) {
      show(e?.message || 'Failed to save content', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}><CircularProgress/></Box>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Content Editor</Typography>
      <Tabs value={tab} onChange={(_, v: TabKey) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Home" value="home" />
        <Tab label="About" value="about" />
      </Tabs>

      {tab === 'home' && (
        <Box component="form" noValidate autoComplete="off">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Hero Title" value={home.heroTitle || ''} onChange={e => setHome(s => ({...s, heroTitle: e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Hero Subtitle" value={home.heroSubtitle || ''} onChange={e => setHome(s => ({...s, heroSubtitle: e.target.value}))}/>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Hero Image URL" value={home.heroImageUrl || ''} onChange={e => setHome(s => ({...s, heroImageUrl: e.target.value}))}/>
            </Grid>
          </Grid>
        </Box>
      )}

      {tab === 'about' && (
        <Box component="form" noValidate autoComplete="off">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Title" value={about.title || ''} onChange={e => setAbout(s => ({...s, title: e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Subtitle" value={about.subtitle || ''} onChange={e => setAbout(s => ({...s, subtitle: e.target.value}))}/>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Banner Image URL" value={about.bannerImageUrl || ''} onChange={e => setAbout(s => ({...s, bannerImageUrl: e.target.value}))}/>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={6} label="Body" value={about.body || ''} onChange={e => setAbout(s => ({...s, body: e.target.value}))}/>
            </Grid>
          </Grid>
        </Box>
      )}

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({...s, open:false}))}>
        <Alert onClose={() => setSnack(s => ({...s, open:false}))} severity={snack.sev} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ContentEditor;
